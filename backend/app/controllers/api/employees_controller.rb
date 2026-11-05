module Api
  class EmployeesController < BaseController
    def index
      search = EmployeeSearch.new(params.permit(:q, :country, :department, :sort, :dir, :page, :per_page))
      render json: {
        data: search.relation.map { |employee| EmployeeSerializer.summary(employee) },
        meta: {
          page: search.page,
          per_page: search.per_page,
          total: search.total,
          total_pages: (search.total.to_f / search.per_page).ceil
        }
      }
    end
  end
end
