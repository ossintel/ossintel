import { describe, expect, test } from "vitest";
import { detectInput } from "./input-parser";

describe("input-parser - detectInput", () => {
  test("should detect GitHub orgs correctly from various syntaxes", () => {
    // URL variants
    const res1 = detectInput("https://github.com/organizations/react18-tools/");
    expect(res1).toEqual({
      platform: "github",
      type: "org",
      owner: "react18-tools",
      rawInput: "https://github.com/organizations/react18-tools/",
    });

    const res2 = detectInput("https://github.com/orgs/react18-tools");
    expect(res2).toEqual({
      platform: "github",
      type: "org",
      owner: "react18-tools",
      rawInput: "https://github.com/orgs/react18-tools",
    });

    // Shorthand path prefix
    const res3 = detectInput("organizations/react18-tools");
    expect(res3).toEqual({
      platform: "github",
      type: "org",
      owner: "react18-tools",
      rawInput: "organizations/react18-tools",
    });

    const res4 = detectInput("orgs/react18-tools");
    expect(res4).toEqual({
      platform: "github",
      type: "org",
      owner: "react18-tools",
      rawInput: "orgs/react18-tools",
    });

    // Prefix shortcuts
    const res5 = detectInput("org:react18-tools");
    expect(res5).toEqual({
      platform: "github",
      type: "org",
      owner: "react18-tools",
      rawInput: "org:react18-tools",
    });

    const res6 = detectInput("github:org:react18-tools");
    expect(res6).toEqual({
      platform: "github",
      type: "org",
      owner: "react18-tools",
      rawInput: "github:org:react18-tools",
    });
  });

  test("should fallback to unknown type for bare GitHub account queries", () => {
    const res = detectInput("mayank1513");
    expect(res).toEqual({
      platform: "github",
      type: "unknown",
      owner: "mayank1513",
      rawInput: "mayank1513",
    });
  });

  test("should detect GitHub repositories correctly", () => {
    const res1 = detectInput("https://github.com/react18-tools/kosha");
    expect(res1).toEqual({
      platform: "github",
      type: "repo",
      owner: "react18-tools",
      repo: "kosha",
      rawInput: "https://github.com/react18-tools/kosha",
    });

    const res2 = detectInput("react18-tools/kosha");
    expect(res2).toEqual({
      platform: "github",
      type: "repo",
      owner: "react18-tools",
      repo: "kosha",
      rawInput: "react18-tools/kosha",
    });

    const res3 = detectInput("github:react18-tools/kosha");
    expect(res3).toEqual({
      platform: "github",
      type: "repo",
      owner: "react18-tools",
      repo: "kosha",
      rawInput: "github:react18-tools/kosha",
    });
  });

  test("should detect NPM users and packages correctly", () => {
    // Scoped package
    const res1 = detectInput("@babel/core");
    expect(res1).toEqual({
      platform: "npm",
      type: "package",
      name: "@babel/core",
      rawInput: "@babel/core",
    });

    // Scoped package prefix
    const res2 = detectInput("npm:@babel/core");
    expect(res2).toEqual({
      platform: "npm",
      type: "package",
      name: "@babel/core",
      rawInput: "npm:@babel/core",
    });

    // Bare package prefix
    const res3 = detectInput("npm:kosha");
    expect(res3).toEqual({
      platform: "npm",
      type: "package",
      name: "kosha",
      rawInput: "npm:kosha",
    });

    // Package URL
    const res4 = detectInput("https://www.npmjs.com/package/lodash");
    expect(res4).toEqual({
      platform: "npm",
      type: "package",
      name: "lodash",
      rawInput: "https://www.npmjs.com/package/lodash",
    });

    // Scoped Package URL
    const res5 = detectInput("https://www.npmjs.com/package/@babel/core");
    expect(res5).toEqual({
      platform: "npm",
      type: "package",
      name: "@babel/core",
      rawInput: "https://www.npmjs.com/package/@babel/core",
    });

    // NPM User shorthands
    const res6 = detectInput("npm:~mayank1513");
    expect(res6).toEqual({
      platform: "npm",
      type: "user",
      name: "mayank1513",
      rawInput: "npm:~mayank1513",
    });

    const res7 = detectInput("~mayank1513");
    expect(res7).toEqual({
      platform: "npm",
      type: "user",
      name: "mayank1513",
      rawInput: "~mayank1513",
    });

    // NPM User URLs
    const res8 = detectInput("https://www.npmjs.com/~mayank1513");
    expect(res8).toEqual({
      platform: "npm",
      type: "user",
      name: "mayank1513",
      rawInput: "https://www.npmjs.com/~mayank1513",
    });
  });

  test("should detect StackOverflow profiles correctly", () => {
    const res1 = detectInput("so:12345");
    expect(res1).toEqual({
      platform: "stackoverflow",
      type: "user",
      profileId: "12345",
      rawInput: "so:12345",
    });

    const res2 = detectInput("https://stackoverflow.com/users/12345/some-user");
    expect(res2).toEqual({
      platform: "stackoverflow",
      type: "user",
      profileId: "12345",
      name: "some-user",
      rawInput: "https://stackoverflow.com/users/12345/some-user",
    });
  });

  test("should detect placeholder VSCode, Medium, and Leetcode platforms", () => {
    const res1 = detectInput("vscode:publisher/extension");
    expect(res1).toEqual({
      platform: "vscode",
      type: "package",
      name: "publisher.extension",
      rawInput: "vscode:publisher/extension",
    });

    const res2 = detectInput("medium:@mayank1513");
    expect(res2).toEqual({
      platform: "medium",
      type: "user",
      profileId: "@mayank1513",
      rawInput: "medium:@mayank1513",
    });

    const res3 = detectInput("https://medium.com/@mayank1513");
    expect(res3).toEqual({
      platform: "medium",
      type: "user",
      profileId: "mayank1513",
      rawInput: "https://medium.com/@mayank1513",
    });

    const res4 = detectInput("leetcode:mayank1513");
    expect(res4).toEqual({
      platform: "leetcode",
      type: "user",
      profileId: "mayank1513",
      rawInput: "leetcode:mayank1513",
    });
  });
});
