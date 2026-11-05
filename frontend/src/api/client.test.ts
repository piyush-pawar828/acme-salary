import { api, ApiError } from "./client";

describe("api", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  function respond(status: number, body: unknown) {
    fetchMock.mockResolvedValue(
      new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
    );
  }

  it("returns parsed JSON and sends credentials", async () => {
    respond(200, { status: "ok" });
    await expect(api<{ status: string }>("/api/health")).resolves.toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledWith("/api/health", expect.objectContaining({ credentials: "same-origin" }));
  });

  it("throws ApiError with field errors on 422", async () => {
    respond(422, { errors: { email: ["has already been taken"] } });
    await expect(api("/api/employees", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 422,
      errors: { email: ["has already been taken"] },
    });
    await expect(api("/api/employees", { method: "POST", body: {} })).rejects.toBeInstanceOf(ApiError);
  });

  it("emits an unauthorized event on 401", async () => {
    respond(401, { errors: { base: ["login required"] } });
    const listener = vi.fn();
    window.addEventListener("unauthorized", listener);
    await expect(api("/api/session")).rejects.toMatchObject({ status: 401 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("returns undefined for 204", async () => {
    respond(204, undefined);
    await expect(api("/api/session", { method: "DELETE" })).resolves.toBeUndefined();
  });
});
