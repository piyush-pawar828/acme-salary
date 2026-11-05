module Api
  class HealthController < BaseController
    def show
      render json: { status: "ok" }
    end
  end
end
