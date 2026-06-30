---
title: "Learning Raft by Building It"
description: "Notes from writing a tiny Raft KV store in Go, and why the protocol matters if you run etcd, Consul, or Kubernetes."
publishDate: "21 August 2025"
updatedDate: "10 June 2026"
tags: ["distributed-systems", "golang"]
showTOC: true
---

Raft is the consensus protocol that keeps a group of machines in sync when some of them fail. It also sits underneath a lot of infrastructure you may already run: etcd (and therefore every Kubernetes control plane), Consul, CockroachDB, and NATS JetStream all use it. I had read the paper and watched the talks, but I only really understood it after building a small Raft-backed key/value store in Go. This post covers what I learned and what took the longest to get right.

## Background

Three machines each hold a copy of a database. A client writes to one of them, and the other two need to end up with the same data. That has to hold even when a machine is offline at the moment of the write, and even when two machines take conflicting writes at the same instant and the cluster is forced to settle on a single order.

This is the same problem whether the data is a key/value store, a service catalog, or the desired state of a Kubernetes cluster. Any system that needs one consistent answer across several machines has to solve it somehow, and Raft is the design most of them have settled on.

Raft solves this by giving the cluster a single leader. Clients send writes to the leader, and the leader is responsible for getting the other nodes (followers) to apply the same writes in the same order. If the leader stops responding, the followers elect a new one.

The rest of Raft is the set of rules that keep leader election and replication correct when nodes fail or messages are dropped.

## How it works

There are three parts to understand.

**Leader election.** Each node runs a countdown timer. If the timer expires before the node hears from a leader, the node starts an election by asking the others to vote for it. A candidate that receives votes from a majority of the cluster becomes leader. The timers are set to random values within a range so that two nodes are unlikely to start an election at exactly the same instant. Without that randomization, candidates split the vote and no one wins.

**Replication.** Clients send writes to the leader. The leader appends the write to its log, then sends the entry to the followers in an AppendEntries RPC. Once a majority of nodes have acknowledged the entry, the leader marks it as committed and applies it to its state machine. Followers learn about the commit on the next AppendEntries and apply the entry to their own state machines.

**Safety.** Raft has additional rules that prevent a newly elected leader from losing committed data. The most important one: a candidate can only win an election if its log is at least as up to date as a majority of voters. Section 5.4 of the Raft paper works through why that rule is enough.

## What I built

The KV store exposes two commands: `SET key value` and `GET key`. All three replicas return the same value for a given key.

Some implementation shortcuts:

- The three nodes are three goroutines in a single Go process. They communicate through Go channels, not real RPC.
- State is persisted with a write-ahead log and periodic snapshots. Restarting the process does not lose committed entries.
- I did not implement cluster membership changes, log compaction beyond snapshots, or recovery from network partitions.

The election timer was where most of my early bugs lived. Two details mattered more than I expected. The timeout has to be drawn independently on each node, or the randomization that's supposed to break ties does nothing. And the timer has to reset every time the node hears a valid AppendEntries from the current leader — the first time I missed that reset, every node's timer fired on the same interval and the whole cluster turned into candidates at once.

## Notes if you build your own

The heartbeat interval and the election timeout have to be sized relative to each other, with the election timeout several times larger than the heartbeat. Let them get too close and followers time out before the next heartbeat lands, so the cluster keeps electing new leaders instead of replicating writes — it looks busy but never commits anything. The paper suggests a 10–50 ms heartbeat and a 150–300 ms election timeout; I started outside those ranges and spent an evening chasing that exact symptom before section 5.6 set me straight. The same knob shows up in production, where etcd exposes `--heartbeat-interval` and `--election-timeout` for the same reason, mostly for clusters spread across high-latency links.

Commit ordering was the other thing that took time, and it's closely related: the leader has to wait until a majority of replicas have the entry in their logs before it applies the entry locally and answers the client. Answering first and replicating after is faster, but the write is gone if the leader dies before the followers catch up.

## Resources

| Link | Notes |
|------|--------|
| [Raft consensus site](https://raft.github.io/) | Papers, talks, courses, and implementations. |
| [The Secret Lives of Data: Raft](https://thesecretlivesofdata.com/raft/) | Interactive visualization of elections, replication, and recovery. |
| [Designing for Understandability (talk)](https://www.youtube.com/watch?v=vYp4LYbnnW8) | The original authors on why Raft prioritizes clarity. |
