Rails.application.routes.draw do
  namespace :api do
    get "health", to: "health#show"
    resource :session, only: [:show, :create, :destroy]
    resource :meta, only: :show
    resources :employees, only: [:index]
  end
end
