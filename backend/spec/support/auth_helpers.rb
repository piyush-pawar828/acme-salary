module AuthHelpers
  def sign_in(user, password: "password123")
    post "/api/session", params: { email: user.email, password: password }, as: :json
    expect(response).to have_http_status(:ok)
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
