# Records a salary for an employee. History is append-only: every call
# inserts a new row, then re-points employees.current_salary_id at the row
# with the latest effective date (ties broken by id).
class SalaryChange
  def self.call(employee:, amount:, effective_on:, by:, note: nil)
    new(employee).call(amount: amount, effective_on: effective_on, note: note, by: by)
  end

  def initialize(employee)
    @employee = employee
  end

  def call(amount:, effective_on:, note:, by:)
    Salary.transaction do
      salary = @employee.salaries.create!(
        amount: amount,
        currency_code: @employee.country.currency_code,
        effective_on: effective_on,
        note: note,
        created_by: by
      )
      @employee.update_column(:current_salary_id, current_salary_id)
      salary
    end
  end

  private

  def current_salary_id
    @employee.salaries.order(effective_on: :desc, id: :desc).pick(:id)
  end
end
