module Api
  class HealthController < BaseController
    skip_before_action :require_login

    def show
      render json: { status: "ok" }
    end
  end
end
