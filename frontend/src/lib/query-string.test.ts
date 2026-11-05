import { parseSearch, serializeSearch, type SearchState } from "./query-string";

describe("query-string", () => {
  it("parses with defaults", () => {
    expect(parseSearch(new URLSearchParams(""))).toEqual({
      q: "",
      country: "",
      department: "",
      sort: "name",
      dir: "asc",
      page: 1,
    });
  });

  it("reads provided values and coerces page", () => {
    const state = parseSearch(new URLSearchParams("q=ada&country=IN&department=3&sort=salary&dir=desc&page=4"));
    expect(state).toEqual({ q: "ada", country: "IN", department: "3", sort: "salary", dir: "desc", page: 4 });
  });

  it("falls back to page 1 for junk", () => {
    expect(parseSearch(new URLSearchParams("page=zero")).page).toBe(1);
    expect(parseSearch(new URLSearchParams("page=-2")).page).toBe(1);
  });

  it("serialises only non-default values", () => {
    const state: SearchState = { q: "", country: "GB", department: "", sort: "name", dir: "asc", page: 2 };
    expect(serializeSearch(state).toString()).toBe("country=GB&page=2");
  });
});
