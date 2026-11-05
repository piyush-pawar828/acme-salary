module Api
  class MetaController < BaseController
    def show
      render json: {
        # The server's calendar date is the single source of truth for "today"
        # (salary effective dates are validated against it), so the UI uses
        # this rather than the browser's local date.
        today: Date.current,
        countries: Country.order(:name).map { |c| c.slice(:id, :code, :name, :currency_code, :usd_rate, :rate_as_of) },
        departments: Department.order(:name).map { |d| d.slice(:id, :name) }
      }
    end
  end
end
