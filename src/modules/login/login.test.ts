import { invalidlogin, confirmEmailError } from "./error-messages";
import { User } from "../../entity/User";
import { createTypeormConn } from "../../utils/create-typeorm-conn";
import { Connection } from "typeorm";
import { TestClient } from "../../utils/test-client";

let conn: Connection;
const email: string = "make23@com";
const password: string = "osudhwusbo";

beforeAll(async () => {
  conn = await createTypeormConn();
});

afterAll(async () => {
  conn.close();
});

describe("login", () => {
  test("Email Not Found Send Back Error", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    const response = await client.login(email, password);
    expect(response.data).toEqual({
      login: [
        {
          message: invalidlogin,
          path: "email"
        }
      ]
    });
  });

  test("email not confirmed", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    await client.register("maks@nfn.com", password);
    const response2 = await client.login("maks@nfn.com", password);

    expect(response2.data).toEqual({
      login: [
        {
          path: "email",
          message: confirmEmailError
        }
      ]
    });
  });

  test("bad password", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    await client.register(email, password);

    await User.update({ email }, { confirmed: true });

    const response2 = await client.login(email, "wrongpassword");

    expect(response2.data).toEqual({
      login: [
        {
          path: "email",
          message: invalidlogin
        }
      ]
    });
  });
});
