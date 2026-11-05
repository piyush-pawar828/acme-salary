module Api
  class BaseController < ActionController::API
    include ActionController::Cookies

    before_action :require_login

    rescue_from ActiveRecord::RecordNotFound do
      render json: { errors: { base: [ "not found" ] } }, status: :not_found
    end

    rescue_from ActiveRecord::RecordInvalid do |error|
      render json: { errors: error.record.errors.to_hash }, status: :unprocessable_entity
    end

    rescue_from ActionController::ParameterMissing do |error|
      render json: { errors: { base: [ error.message ] } }, status: :bad_request
    end

    private

    def current_user
      @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
    end

    def require_login
      render json: { errors: { base: [ "login required" ] } }, status: :unauthorized unless current_user
    end

    def user_json(user)
      { id: user.id, name: user.name, email: user.email }
    end
  end
end
