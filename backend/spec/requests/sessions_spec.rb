require "rails_helper"

RSpec.describe "Session" do
  let!(:user) { create_user(password: "password123") }

  it "logs in with valid credentials and returns the user" do
    post "/api/session", params: { email: "HR@acme.example", password: "password123" }, as: :json

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq("id" => user.id, "name" => "HR Manager", "email" => "hr@acme.example")
  end

  it "rejects a bad password" do
    post "/api/session", params: { email: user.email, password: "nope" }, as: :json

    expect(response).to have_http_status(:unauthorized)
    expect(response.parsed_body).to eq("errors" => { "base" => [ "Invalid email or password" ] })
  end

  it "returns 401 from GET /api/session when logged out" do
    get "/api/session"
    expect(response).to have_http_status(:unauthorized)
  end

  it "returns the user from GET /api/session after login" do
    sign_in(user)
    get "/api/session"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["email"]).to eq("hr@acme.example")
  end

  it "logs out with DELETE /api/session" do
    sign_in(user)
    delete "/api/session"
    expect(response).to have_http_status(:no_content)

    get "/api/session"
    expect(response).to have_http_status(:unauthorized)
  end

  it "keeps the health endpoint public" do
    get "/api/health"
    expect(response).to have_http_status(:ok)
  end
end
