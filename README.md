# M2: Actors and Remote Procedure Calls (RPC)

## Summary

> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M2 (`30`) and the lines of code per task.
> My implementation comprises `5` software components, totaling `<300>` lines of code. Key challenges included `<1.In comm and node.js part, I met the problem about how to know the error when I got the response from node.js. To handle this, I use the serialization and deserialization from M1, and add an extra step to see whether my response is error when I get response. 2. In rpc part, the most challenging part for me is how to replace '__NODE_INFO__' with actual node config. Although it seems easy, but for me, when I serialize function in M1, I keep the entire funtion body, simply use toString() to do serialization, which means if I simply replace '__NODE_INFO__' with JSON.stringify(node), my function body is not valid anymore, and error occurs in execution. So, instead of try to replace '__NODE_INFO__' with whole node object, I tried to divide it into '__IP_INFO__'  and '__PORT_INFO__', replace these things are much easier as they are just string and number.>`.

## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation
> _Correctness_: I wrote `<10>` tests; these tests take `<0.302s>` to execute.
> _Performance_: I characterized the performance of comm and RPC by sending 1000 service requests in a tight loop. Average throughput and latency is recorded in `package.json`.

## Key Feature

> How would you explain the implementation of `createRPC` to someone who has no background in computer science — i.e., with the minimum jargon possible?
> To implement `createRPC`, you should first come up a native function. Then, you should give that function a name to help you to keep track of that native function. As you are the one who create RPC stub, you should also provide your address to let others know where to send request. After that, when someone want to use your native function, just call the stub you created, it will automatically send you a message with your address and name of your native function., you can get the result and send it back.
