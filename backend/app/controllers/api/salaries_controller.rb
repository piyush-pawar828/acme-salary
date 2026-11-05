module Api
  class SalariesController < BaseController
    def create
      employee = Employee.find(params[:employee_id])
      salary_params = params.require(:salary).permit(:amount, :effective_on, :note)

      SalaryChange.call(employee: employee, amount: salary_params[:amount], effective_on: salary_params[:effective_on],
                        note: salary_params[:note], by: current_user)

      render json: EmployeeSerializer.detail(employee.reload), status: :created
    end
  end
end
