# M4: Distributed Storage

## Summary

> Summarize your implementation, including key challenges you encountered

> For this milestone, I implemented all require components and lab components, including mem and store in local and all, reconf, and periodic check for reconf. The most challenging part for me should be periodic check for reconf, the handout is extremely vague about this component.I add the checking part at put in group service (see groups.js in local folder), whenever a group is generated, we should periodically check that group to see whether it needs reconfig. The most difficult part is how to test my auto reconfiguration, as the check is called periodically, there's no guarantee when check should happen. So, it takes me pretty long time to debug and set a proper timer to test this component.

> Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M4 (`40`) and the lines of code (`1250 including tests`)per task.

## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation
> _Correctness_ -- number of tests and time they take.

> I implemented 5 tests for basic components: store, mem and hash, takes 1.747 s in total. Moreover, I implemented 1 extra test to detect the need to reconfigure, which takes 22.111 s (including waiting time to make sure periodic check was called suceffully).

> _Performance_ -- insertion and retrieval.

> For performance test an AWS, see store.performance.test.js under test-student folder
> Insert Latency: 1.688 ms/op
> Insert Throughput: 592.28 ops/sec
> Get Latency: 0.018 ms/op
> Get Throughput: 55757.83 ops/sec

## Key Feature

> Why is the `reconf` method designed to first identify all the keys to be relocated and then relocate individual objects instead of fetching all the objects immediately and then pushing them to their corresponding locations?

The reconf method first finds which objects need to be moved before actually moving them to avoid storing too much data in memory at once. This makes the system more efficient and prevents issues if a failure happens during the process.
