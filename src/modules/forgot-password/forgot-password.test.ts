import { User } from "../../entity/User";
import { Connection } from "typeorm";
import { createTypeormConn } from "../../utils/create-typeorm-conn";
import { TestClient } from "../../utils/test-client";
import { createForgotPasswordLink } from "../../utils/create-forgot-password-link";
import * as Redis from "ioredis";
import { forgotPasswordLockAccount } from "../../utils/forgot-password-lock-account";

import { accountLockedResponse } from "../login/responses";
import { passwordNotLongEnough } from "../register/error-messages";
import { expiredKeyError } from "./error-messages";

let userId: string;
let conn: Connection;
const redis = new Redis();
const email = "bob5@bob.com";
const password = "jlkajoioiqwe";
const newPassword = "oidshodsdbgsiud";

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

describe("forgot password", () => {
  test("working ", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    await forgotPasswordLockAccount(userId, redis);
    const url = await createForgotPasswordLink("", userId, redis);
    const parts = url.split("/");
    const key = parts[parts.length - 1];

    expect(await client.login(email, password)).toEqual({
      data: {
        login: accountLockedResponse
      }
    });

    expect(await client.forgotPasswordChange("a", key)).toEqual({
      data: {
        forgotPasswordChange: [
          {
            path: "newPassword",
            message: passwordNotLongEnough
          }
        ]
      }
    });

    const response = await client.forgotPasswordChange(newPassword, key);
    expect(response.data).toEqual({
      forgotPasswordChange: null
    });

    expect(await client.forgotPasswordChange("fnjodfdjfnd", key)).toEqual({
      data: {
        forgotPasswordChange: [
          {
            path: "key",
            message: expiredKeyError
          }
        ]
      }
    });

    expect(await client.login(email, newPassword)).toEqual({
      data: {
        login: null
      }
    });
  });
});
