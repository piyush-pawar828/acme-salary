module Api
  class MetaController < BaseController
    def show
      render json: {
        countries: Country.order(:name).map { |c| c.slice(:id, :code, :name, :currency_code, :usd_rate, :rate_as_of) },
        departments: Department.order(:name).map { |d| d.slice(:id, :name) }
      }
    end
  end
end
