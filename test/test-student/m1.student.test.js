/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require("../../config.js");

test("(1 pts) student test", () => {
  const num = 123;
  const serialized = distribution.util.serialize(num);
  const deserialized = distribution.util.deserialize(serialized);

  expect(deserialized).toEqual(num);
});

test("(1 pts) student test", () => {
  const string = "abc@132**";
  const serialized = distribution.util.serialize(string);
  const deserialized = distribution.util.deserialize(serialized);

  expect(deserialized).toEqual(string);
});

test("(1 pts) student test", () => {
  const b1 = true;
  const b2 = false;
  const serialized1 = distribution.util.serialize(b1);
  const deserialized1 = distribution.util.deserialize(serialized1);
  const serialized2 = distribution.util.serialize(b2);
  const deserialized2 = distribution.util.deserialize(serialized2);
  expect(deserialized1).toEqual(b1);
  expect(deserialized2).toEqual(b2);
});

test("(1 pts) student test", () => {
  const serialized = distribution.util.serialize(null);
  const deserialized = distribution.util.deserialize(serialized);

  expect(deserialized).toEqual(null);
});

test("(1 pts) student test", () => {
  let v;
  const serialized = distribution.util.serialize(v);
  const deserialized = distribution.util.deserialize(serialized);

  expect(deserialized).toEqual(undefined);
});
