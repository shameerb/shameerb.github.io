---
title: "Learning Raft by Building It"
description: "Notes from writing a tiny Raft KV store in Go, and why the protocol matters if you run etcd, Consul, or Kubernetes."
publishDate: "21 August 2025"
updatedDate: "10 June 2026"
tags: ["distributed-systems", "golang"]
showTOC: true
---

Raft is the consensus protocol that keeps a group of machines in sync when some of them fail. It also sits underneath a lot of infrastructure you may already run: etcd (and therefore every Kubernetes control plane), Consul, CockroachDB, and NATS JetStream all use it. I had read the paper and watched the talks, but I only really understood it after building a small Raft-backed key/value store in Go. This post covers what I learned and what took the longest to get right.

Code: [shameerb/toy-raft](https://github.com/shameerb/toy-raft).

## Background

Three machines each hold a copy of a database. A client writes to one of them. The other two need to end up with the same data. If one of the three is offline when the write happens, the other two should still make progress. If two of them receive conflicting writes at the same time, the cluster has to pick one and stick with it.

This is the same problem whether the data is a key/value store, a service catalog, or the desired state of a Kubernetes cluster. Any system that needs one consistent answer across several machines has to solve it somehow, and Raft is the design most of them have settled on.

Raft solves this by giving the cluster a single leader. Clients send writes to the leader, and the leader is responsible for getting the other nodes (followers) to apply the same writes in the same order. If the leader stops responding, the followers elect a new one.

The rest of Raft is the set of rules that keep leader election and replication correct when nodes fail or messages are dropped.

## How it works

There are three parts to understand.

**Leader election.** Each node runs a countdown timer. If the timer expires before the node hears from a leader, the node starts an election by asking the others to vote for it. A candidate that receives votes from a majority of the cluster becomes leader. The timers are set to random values within a range so that two nodes are unlikely to start an election at exactly the same instant. Without that randomization, candidates split the vote and no one wins.

**Replication.** Clients send writes to the leader. The leader appends the write to its log, then sends the entry to the followers in an AppendEntries RPC. Once a majority of nodes have acknowledged the entry, the leader marks it as committed and applies it to its state machine. Followers learn about the commit on the next AppendEntries and apply the entry to their own state machines.

**Safety.** Raft has additional rules that prevent a newly elected leader from losing committed data. The most important one: a candidate can only win an election if its log is at least as up to date as a majority of voters. Section 5 of the Raft paper covers safety in detail, and the visualization linked at the bottom of this post walks through it.

## What I built

The KV store exposes two commands: `SET key value` and `GET key`. All three replicas return the same value for a given key.

Some implementation shortcuts:

- The three nodes are three goroutines in a single Go process. They communicate through Go channels, not real RPC.
- State is persisted with a write-ahead log and periodic snapshots. Restarting the process does not lose committed entries.
- I did not implement cluster membership changes, log compaction beyond snapshots, or recovery from network partitions.

The core of the election timer reset:

```go
func (n *Node) resetElectionTimer() {
    if n.electionTimer != nil {
        n.electionTimer.Stop()
    }
    timeout := minElectionTimeout + time.Duration(rand.Int63n(int64(electionJitter)))
    n.electionTimer = time.AfterFunc(timeout, n.startElection)
}
```

Two things about this code. First, `rand.Int63n` is the source of the randomized timeout that keeps candidates from starting simultaneous elections. Each node's timeout is drawn independently, so the first one to time out has a real chance of completing its election before the others react. Second, the timer has to be reset every time the node receives a valid AppendEntries from the current leader. If the reset is missing, every node's timer expires on the first interval and they all become candidates at once.

## Notes if you build your own

The heartbeat interval and election timeout have to be sized correctly relative to each other. The election timeout has to be several times larger than the heartbeat interval. If they are close, followers time out before the next heartbeat arrives and the cluster keeps electing new leaders instead of replicating writes. The symptom is a cluster that looks busy but never commits anything. The Raft paper suggests a heartbeat of 10 to 50 milliseconds and an election timeout of 150 to 300 milliseconds. I started outside those ranges and spent an evening chasing the symptoms before reading section 5.6 of the paper. The same constraint shows up in production: etcd exposes `--heartbeat-interval` and `--election-timeout` as tuning flags for exactly this reason, mainly for clusters spread across high-latency links.

The other thing that took time was the order of operations when committing an entry. The leader has to wait until a majority of replicas have appended the entry to their logs before it applies the entry locally and responds to the client. If the leader responds first and only then waits for replication, the response is fast but the write can be lost if the leader fails before the followers catch up.

## Resources

| Link | Notes |
|------|--------|
| [Raft consensus site](https://raft.github.io/) | Papers, talks, courses, and implementations. |
| [The Secret Lives of Data: Raft](https://thesecretlivesofdata.com/raft/) | Interactive visualization of elections, replication, and recovery. |
| [Designing for Understandability (talk)](https://www.youtube.com/watch?v=vYp4LYbnnW8) | The original authors on why Raft prioritizes clarity. |
