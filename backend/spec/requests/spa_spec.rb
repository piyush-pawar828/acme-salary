require "rails_helper"

RSpec.describe "Single-page app fallback" do
  let(:index) { Rails.root.join("public/index.html") }

  around do |example|
    existed = index.exist?
    original = existed ? index.read : nil
    index.dirname.mkpath
    index.write("<!doctype html><title>spa</title>")
    example.run
  ensure
    existed ? index.write(original) : index.delete
  end

  it "serves index.html for app routes without login" do
    get "/employees/42"
    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("text/html")
    expect(response.body).to include("<title>spa</title>")
  end

  it "serves index.html even without an Accept header" do
    get "/employees/42", headers: { "Accept" => "*/*" }
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("<title>spa</title>")
  end

  it "does not swallow unknown API routes" do
    get "/api/nope"
    expect(response).to have_http_status(:not_found)
    expect(response.media_type).to eq("application/json")
  end
end
