# Serves the compiled React app for any non-API path so client-side routes
# (e.g. /employees/42) work on a hard refresh. In development the Vite dev
# server handles this instead.
class SpaController < ActionController::Base
  INDEX = Rails.root.join("public/index.html")

  def index
    if INDEX.exist?
      send_file INDEX, type: "text/html", disposition: "inline"
    else
      render plain: "Frontend build not found. Run `npm run build` in frontend/.", status: :not_found
    end
  end
end
