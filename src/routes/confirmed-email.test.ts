import fetch from "node-fetch";

test("send invalid back if bad id sent", async () => {
  const response = await fetch(
    `${process.env.TEST_HOST}/confirm/1247747457542436`
  );
  const text = await response.text();
  expect(text).toEqual("invalid");
});
