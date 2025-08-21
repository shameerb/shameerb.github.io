---
title: "Raft: A distributed consensus algorithm"
description: "Raft: A distributed consensus algorithm"
publishDate: "20 Augus 2025"
updatedDate: "20 Augus 2025"
tags: ["distributed-systems", "golang"]
draft: true
showTOC: true
---


<!-- # **Understanding Raft: Consensus Made Simple** -->

Distributed systems are everywhere—databases, cloud services, microservices platforms. But making a cluster of machines **act like one reliable system** is harder than it sounds. Machines fail, networks split, messages get delayed or dropped. How do you ensure that **all nodes agree on the same state**, no matter what?

That’s the **consensus problem**. And Raft is one of the most widely used solutions.

## Why Do We Need Consensus?

Imagine three servers keeping track of bank transactions. If one accepts a withdrawal but another doesn’t, suddenly your account shows two different balances. That’s unacceptable.

Consensus protocols guarantee that **every server agrees on the same log of operations**—even if some crash or networks misbehave. This replicated log then drives the actual application (like a key-value store, database, or service registry).

Other protocols like **Paxos** existed earlier, but Raft became popular because it’s **understandable and implementable**—a consensus algorithm designed to be taught.

## The Raft Mental Model (in one picture)

Raft splits the problem into three digestible parts:

1. **Leader election** – pick one node to be the “boss” who orders client requests.
2. **Log replication** – the leader appends entries and ensures they are copied consistently to followers.
3. **Safety** – even with crashes, no two leaders will ever commit conflicting results.

At any time, nodes in a Raft cluster are in one of three roles:

* **Leader**: handles client requests, manages replication.
* **Follower**: passive, accepts updates from the leader.
* **Candidate**: a follower that times out and tries to become leader.

Time is divided into **terms** (like “epochs”); each term has at most one leader.

## Leader Election (Step 1)

* Nodes start as **followers**, waiting for heartbeat messages from the leader.
* If a follower waits too long (timeout) without hearing from a leader, it becomes a **candidate**.
* Candidates ask for votes (`RequestVote` RPC).
* If a candidate gets a majority, it becomes the new **leader** and starts sending heartbeats.
* Randomized timeouts avoid ties, so usually only one node wins.


## Log Replication (Step 2)

* Clients send commands (e.g., `PUT key=value`) to the **leader**.
* The leader appends this command as a **log entry**.
* The leader sends **AppendEntries** RPCs to followers.
* Once a majority have written the entry, the leader **commits** it and applies it to the state machine.
* Followers apply the entry too—keeping the cluster in sync.

This ensures that every node sees the same sequence of operations.


## Safety (Step 3)

Raft ensures:

* **Log Matching**: if two entries share an index and term, their history is identical.
* **Leader Completeness**: committed entries never get lost; future leaders must contain them.
* **State Machine Safety**: entries are applied in the same order everywhere.

Even after crashes or restarts, the system won’t diverge.


## Who Uses Raft?

You may already rely on Raft daily without knowing:

* **etcd** (Kubernetes’ backbone)
* **Consul** (service discovery)
* **TiKV & CockroachDB** (distributed databases)
* **HashiCorp Nomad** (scheduler)

It’s the “go-to” consensus algorithm for production systems.


## Coming Up: Building Raft in Go