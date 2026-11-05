Rails.application.routes.draw do
  namespace :api do
    get "health", to: "health#show"
    resource :session, only: [ :show, :create, :destroy ]
    resource :meta, only: :show
    get "analytics/overview", to: "analytics#overview"
    get "analytics/groups", to: "analytics#groups"
    get "analytics/extremes", to: "analytics#extremes"
    resources :employees, only: [ :index, :show, :create, :update, :destroy ] do
      resources :salaries, only: :create
    end
  end
end
