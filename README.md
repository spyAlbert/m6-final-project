# M3: Node Groups & Gossip Protocols

## Summary

> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M3 (`40`) and the lines of code per task.
> My implementation comprises `7` new software components, totaling `450` added lines of code over the previous implementation. Key challenges included `The most challenge part is spawn and stop in status component, as it start a new node in child process, it's pretty hard to debug and figure out what's happened in this process, and how to create a proper RPC stub to notify the caller when node is all set and started. The way I used to slove is try to log something in terminal to see when bad things happeded and code got stuck. Also, I checked carefull about node.js in local folder, find out what exactly happened when starting a node, specifically what parameter the callback expected to take.`.

## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation
> _Correctness_ -- number of tests and time they take.

> `In this milestone, I developed 5 test to test correctness, it takes 1.523 s in total.`

> _Performance_ -- spawn times (all students) and gossip (lab/ec-only).

> `I tried 5 spawn and it took 486.122 ms, so latency is 97.22 ms, throughput is 10.29.`

> `I tried gossip with group of 6 nodes, with subset = log(nodes.length),it took 536.250 ms to completes, so latency is 89.38ms, throughput is 11.19.`

## Key Feature

> What is the point of having a gossip protocol? Why doesn't a node just send the message to _all_ other nodes in its group?

> `Gossip protocols efficiently spread information in large distributed systems without overwhelming the network, unlike direct broadcasting. Moreover, they improve fault tolerance, it's acceptable if some node fail to receive message, because the information propagates redundantly through multiple paths.`
