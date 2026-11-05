module Api
  class SessionsController < BaseController
    skip_before_action :require_login, only: :create

    def show
      render json: user_json(current_user)
    end

    def create
      user = User.find_by(email: params[:email].to_s.strip.downcase)

      if user&.authenticate(params[:password].to_s)
        session[:user_id] = user.id
        render json: user_json(user)
      else
        render json: { errors: { base: [ "Invalid email or password" ] } }, status: :unauthorized
      end
    end

    def destroy
      reset_session
      head :no_content
    end
  end
end
