/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
*/

const distribution = require("../config.js");
const fs = require("fs");

// M1 Test Cases

test("m1: sample test", () => {
  const object = { milestone: "m1", status: "complete" };
  const serialized = distribution.util.serialize(object);
  const deserialized = distribution.util.deserialize(serialized);

  expect(deserialized).toEqual(object);
});

test("m1: num test", () => {
  const num = 123;
  const serialized = distribution.util.serialize(num);
  const deserialized = distribution.util.deserialize(serialized);

  expect(deserialized).toEqual(num);
});

test("m1: String test", () => {
  const string = "abc@132**";
  const serialized = distribution.util.serialize(string);
  const deserialized = distribution.util.deserialize(serialized);

  expect(deserialized).toEqual(string);
});

test("m1: Boolean test", () => {
  const b1 = true;
  const b2 = false;
  const serialized1 = distribution.util.serialize(b1);
  const deserialized1 = distribution.util.deserialize(serialized1);
  const serialized2 = distribution.util.serialize(b2);
  const deserialized2 = distribution.util.deserialize(serialized2);
  expect(deserialized1).toEqual(b1);
  expect(deserialized2).toEqual(b2);
});

test("m1: null test", () => {
  const serialized = distribution.util.serialize(null);
  const deserialized = distribution.util.deserialize(serialized);

  expect(deserialized).toEqual(null);
});

test("m1: undefined test", () => {
  let v;
  const serialized = distribution.util.serialize(v);
  const deserialized = distribution.util.deserialize(serialized);

  expect(deserialized).toEqual(undefined);
});

test("m1: complex Object test", () => {
  const object = {
    milestone: "m1",
    status: "complete",
    time: 20,
    finish: true,
    teammates: null,
  };
  const serialized = distribution.util.serialize(object);
  const deserialized = distribution.util.deserialize(serialized);

  expect(deserialized).toEqual(object);
});

test("m1: native Function test", () => {
  const fn = global.fetch;
  const serialized = distribution.util.serialize(fn);
  const deserialized = distribution.util.deserialize(serialized);
  // Native function serialization might not work as expected
  expect(deserialized).toBe(global.fetch);
});

test("m1: native Function test2", () => {
  const fn = fs.writeSync;
  const serialized = distribution.util.serialize(fn);
  const deserialized = distribution.util.deserialize(serialized);
  // Native function serialization might not work as expected
  expect(deserialized).toBe(fs.writeSync);
});
// M2 Test Cases

// M3 Test Cases

// M4 Test Cases

// M5 Test Cases
