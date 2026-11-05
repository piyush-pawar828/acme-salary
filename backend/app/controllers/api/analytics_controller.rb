module Api
  class AnalyticsController < BaseController
    rescue_from ArgumentError do |error|
      render json: { errors: { base: [error.message] } }, status: :bad_request
    end

    def overview
      render json: Analytics::Overview.call
    end

    def groups
      render json: Analytics::GroupStats.call(by: params[:by])
    end

    def extremes
      render json: Analytics::Extremes.call(limit: 10)
    end
  end
end
