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
    # Unknown API paths get a JSON 404 rather than the SPA shell.
    match "*path", to: proc { [ 404, { "Content-Type" => "application/json" }, [ { errors: { base: [ "not found" ] } }.to_json ] ] }, via: :all
  end

  # Everything else is a client-side route: hand it to the React app.
  # Paths that look like files (/assets/app.js) are left to the static
  # middleware so a missing asset 404s instead of returning index.html.
  root to: "spa#index"
  get "*path", to: "spa#index", constraints: ->(request) { !request.path.match?(/\.\w+\z/) }
end
