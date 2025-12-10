---
title: "Learning Raft by Building It"
description: "Raft: An Understandable Guide to Consensus"
publishDate: "21 Augus 2025"
updatedDate: "21 Augus 2025"
tags: ["distributed-systems", "golang"]
showTOC: false
---

*The best way I've found to learn distributed systems is to build them.*

When I first started exploring the *consensus problem*, I quickly realized how abstract it felt. In theory it’s “just agreeing on a value.” In practice? Machines crash, networks drop packets, two nodes both think they’re in charge… and suddenly your “cluster” isn’t clustered at all.

That’s why I chose to implement **Raft** in Go—not because the world needs another Raft implementation, but because building it forces you to understand what really happens when theory meets reality.

## Why Raft?

Consensus is about making sure multiple replicas of a system agree on the same sequence of operations, even in the face of failures. Raft was designed to be:

- **Understandable** → clear roles (leader, follower, candidate) and clean rules.
- **Practical** → widely used in production systems like etcd (Kubernetes datastore), Consul, CockroachDB, and TiKV.
- **Reliable** → once something is committed, it’s committed everywhere.

In short: Raft makes a messy cluster behave like a single reliable system.

In practice, Raft is used for:
-  Metadata/configuration stores (etcd, Consul).
-  Databases with replication (CockroachDB, TiKV).
-  Coordination services where strong consistency matters.

## How Raft Works (at a High Level)

### Leader Election
-  Nodes start as followers.
-  If they don’t hear from a leader, they hold an election.
-  Majority vote decides the leader; ties resolve via randomized timeouts.

### Log Replication
- Clients send commands (e.g. `SET key value`) to the leader.
- The leader appends the command to its log and replicates it to followers.
- Once a majority acknowledge, the entry is committed and applied everywhere.

### Safety
- One leader per term.
- Logs with the same index and term are identical.
- Committed entries are never rolled back.

## What I Actually Built

To keep things simple, I built a **toy Raft-backed key/value store**:
- Three nodes running in one process.
- Elections and heartbeats managed with timers.
- Commands flow through leader election, replication, and commitment.
- Snapshots and write-ahead logs for persistence, so nodes can restart without forgetting their state.

It’s not production-ready—no network partitions, no cluster reconfiguration—but it demonstrates the core Raft mechanics clearly.


## Why Build Instead of Just Read?

Because **building makes the abstractions real**.
- Timeouts stop being abstract numbers—you *feel* them when your leader disappears.
- Watching logs replicate across nodes shows you how consistency emerges.
- Crashing a node mid-commit teaches more than any paper footnote ever could.

That hands-on experience is what makes distributed systems less mysterious and more approachable.


## What’s Next

This post was about the *concepts*—why Raft matters and what problems it solves.

In **another post**, I’ll walk through the actual **Go implementation** of the toy KV store: how elections are coded, how log replication is wired, and where the tricky edge cases live.


## Takeaway

Consensus is a hard problem, but Raft makes it accessible. By implementing even a small version, you can see how leader election, log replication, and safety guarantees keep a cluster consistent.

And once you’ve seen Raft in action, you’ll recognize it as the beating heart of many of today’s distributed systems.

## Resources

* [The Raft Consensus Algorithm](https://raft.github.io/)
  A central hub for Raft: papers, talks, course material, and open-source implementations.

* [The Secret Lives of Data: Raft Visualization](https://thesecretlivesofdata.com/raft/)
  An excellent interactive visualization of leader election, log replication, and failure recovery.

* [Designing for Understandability: The Raft Consensus Algorithm (Talk)](https://www.youtube.com/watch?v=vYp4LYbnnW8)
  A conference talk by Raft’s authors on why Raft was created and how it emphasizes clarity.
