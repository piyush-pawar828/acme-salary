require "rails_helper"

RSpec.describe User do
  it "authenticates with the right password and not the wrong one" do
    user = create_user(password: "secret-pass")
    expect(user.authenticate("secret-pass")).to eq(user)
    expect(user.authenticate("wrong")).to be_falsey
  end

  it "stores email downcased" do
    expect(create_user(email: "HR@Acme.Example").email).to eq("hr@acme.example")
  end
end
