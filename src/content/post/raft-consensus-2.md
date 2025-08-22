---
title: "Raft: An Understandable Guide to Consensus"
description: "Raft: An Understandable Guide to Consensus"
publishDate: "21 Augus 2025"
updatedDate: "21 Augus 2025"
tags: ["distributed-systems", "golang"]
draft: true
# showTOC: true
---


<!-- # Raft: An Understandable Guide to Consensus -->

Consensus is at the heart of distributed systems. Whenever you replicate state across multiple servers—be it a configuration store, a database, or a cluster manager—you need a way for these servers to **agree on the same sequence of operations** even in the face of crashes, delays, or partitions.

That agreement problem is called **consensus**. Raft is a consensus algorithm designed to be **understandable, practical, and implementable**—without sacrificing the guarantees offered by Paxos.

## Part 1 — Why Raft?

Before diving into internals, let’s clarify what Raft solves:

* **Consistency across nodes:** Raft ensures that multiple replicas of a state machine stay in sync, no matter which node a client connects to.
* **Fault tolerance:** As long as a **majority** of nodes are alive, the system continues making progress.
* **Deterministic state:** Raft provides a replicated log that drives state machines to the same output everywhere.

In practice, Raft is used for:

* Metadata/configuration stores (etcd, Consul).
* Databases with replication (CockroachDB, TiKV).
* Coordination services where strong consistency matters.

- In short: Raft ensures your cluster behaves like a **single reliable system**, even with failures.


## Part 2 — Raft at a High Level

Raft decomposes consensus into **three big pieces**:

1. **Leader Election**
   Elect exactly one leader responsible for handling client requests.
2. **Log Replication**
   The leader appends client commands to its log and replicates them across followers.
3. **Safety**
   Rules that guarantee no conflicting logs, no rollback of committed entries, and only one leader per term.

With these building blocks, Raft gives us a replicated, ordered log of operations that every node eventually applies to its state machine.

## Part 3 — Raft Roles and Terms
Every server in Raft takes on one of three roles:

* **Follower:** Passive, responds to requests, waits for leader heartbeats.
* **Candidate:** Starts an election if it doesn’t hear from a leader.
* **Leader:** Handles all client requests, appends log entries, replicates, and sends heartbeats.

Time is divided into **terms**:

* A term starts with an election.
* At most one leader is chosen per term.
* If no leader wins, the next election begins a new term.

This structure ensures clarity and avoids confusion about who is “in charge.”

## Part 4 — The Workflow of Raft

### Leader Election

* Followers timeout → become candidates.
* Candidate requests votes from peers.
* If majority votes: candidate → leader.
* If no one wins: retry with randomized timeouts.

### Log Replication

* Client sends command → leader appends `(term, command)` to its log.
* Leader replicates via **AppendEntries RPC**.
* Once a majority acknowledges, the entry is **committed** and applied to the state machine.
* Followers eventually apply the same committed log.

### Safety Rules

* **Election safety**: at most one leader per term.
* **Log matching**: same `(index, term)` implies same history before it.
* **Leader completeness**: new leader has all committed entries.
* **State machine safety**: once committed, entries are never undone.


## Part 5 — Practical Features: Beyond the Core

Raft isn’t just about elections and logs. Real systems need more:

* **Snapshots (Log Compaction):** Save applied state periodically and discard old log entries to control log size.
* **Membership Changes:** Add/remove nodes safely via *joint consensus*—requiring quorums from both old and new configurations during the transition.
* **Persistence (WAL):** Logs and term info are written to disk before acknowledging. On crash/restart, nodes reload WAL + snapshot.
* **Backpressure:** Leaders can slow or reject requests if followers lag too far behind.


## Part 6 — Building a Tiny Raft-backed KV Store

Theory is good, but let’s wire it into something concrete: a **key/value store**.

* Each command is like `SET k v` or `DEL k`.
* Leader proposes → replicates → commits → applies to KV map.
* Every replica eventually converges to the same KV state.

For a learning demo:

* Simulate 3 nodes inside one process.
* Use timers for elections & heartbeats.
* Print applied entries to watch consensus in action.

This toy KV store won’t handle partitions or disk persistence, but it demonstrates Raft’s mechanics clearly.


## Part 7 — Operations and Tuning in Practice

Running Raft in production involves careful operational choices:

* Use **odd replica counts** (3/5/7) to guarantee quorums.
* **Latency matters**: place replicas close together.
* Monitor **disk performance**: commits usually imply fsyncs.
* Regularly **backup WAL + snapshots**, and test recovery.
* Apply **limits**: bound request sizes, throttle leaders if needed.

These practices keep your Raft cluster stable under load and failure conditions.


## Part 8 — Raft in the Real World

Raft has been battle-tested in many production systems:

* **[etcd](https://etcd.io/docs/v3.3/op-guide/performance/)** → Kubernetes datastore.
* **[Consul](https://developer.hashicorp.com/consul/docs/concept/consensus)** → service discovery and locks.
* **[CockroachDB](https://www.cockroachlabs.com/docs/stable/architecture/overview)** → per-range consensus for SQL replication.
* **[TiKV](https://tikv.org/deep-dive/consensus-algorithm/raft/)** → distributed KV with transactions.

Its adoption stems from being **understandable, reliable, and practical**.


## Part 9 — Raft vs Paxos

Why not Paxos?

* **Understandability:** Raft’s roles, terms, and logs are straightforward; Paxos is notoriously abstract.
* **Performance:** Both offer similar guarantees; Raft’s leader-driven model is often simpler to optimize.
* **Adoption:** Raft dominates in modern distributed systems because of clarity + tooling.


## Takeaway
Raft ensures a group of servers behaves like one reliable system. It solves consensus with leader election, log replication, and strict safety rules, while also adding practical tools like snapshots and membership changes.

If you understand Raft, you understand the beating heart of many distributed systems today.


## Resources

* [Raft paper (Ongaro & Ousterhout)](https://raft.github.io/raft.pdf)
* [Raft Consensus Algorithm](https://raft.github.io/)  
* [Raft - the secret lives of data](https://thesecretlivesofdata.com/raft/)  
* [Designing for Understandability: The Raft Consensus Algorithm - YouTube](https://www.youtube.com/watch?v=vYp4LYbnnW8)  
* [USENIX Raft talk](https://www.usenix.org/conference/atc14/technical-sessions/presentation/ongaro)