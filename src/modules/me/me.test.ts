import { User } from "../../entity/User";
import { Connection } from "typeorm";
import { createTypeormConn } from "../../utils/create-typeorm-conn";
import { TestClient } from "../../utils/test-client";

let userId: string;
let conn: Connection;
const email = "bob5@bob.com";
const password = "jlkajoioiqwe";

beforeAll(async () => {
  conn = await createTypeormConn();
  const user = await User.create({
    email,
    password,
    confirmed: true
  }).save();
  userId = user.id;
});

afterAll(async () => {
  conn.close();
});

describe("me query", () => {
  test("return null if no cookie", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    const response = await client.me();

    expect(response.data.me).toBeNull();
  });

  test("get current user", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    await client.login(email, password);
    const response = await client.me();
    expect(response.data.me).toEqual({
      id: userId,
      email
    });
  });
});
