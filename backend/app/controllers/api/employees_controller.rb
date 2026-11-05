module Api
  class EmployeesController < BaseController
    EMPLOYEE_FIELDS = %i[first_name last_name email country_id department_id job_title hired_on].freeze

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

    def show
      render json: EmployeeSerializer.detail(find_employee)
    end

    def create
      employee = EmployeeCreate.call(
        attrs: params.require(:employee).permit(EMPLOYEE_FIELDS),
        salary: params.require(:salary).permit(:amount, :effective_on, :note),
        by: current_user
      )
      render json: EmployeeSerializer.detail(employee), status: :created
    end

    def update
      employee = find_employee
      # country_id is deliberately permitted so the model's immutability
      # validation can report it as a 422 rather than silently dropping it.
      employee.update!(params.require(:employee).permit(EMPLOYEE_FIELDS))
      render json: EmployeeSerializer.detail(employee)
    end

    def destroy
      find_employee.destroy!
      head :no_content
    end

    private

    def find_employee
      Employee.includes(:country, :department, :current_salary, salaries: :created_by).find(params[:id])
    end
  end
end
