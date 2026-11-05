# Creates an employee together with their initial salary in one transaction.
# Salary validation errors are reported on the employee under "salary.<field>"
# so the API can return a single 422 payload.
class EmployeeCreate
  def self.call(attrs:, salary:, by:)
    employee = Employee.new(attrs)

    Employee.transaction do
      employee.save!
      begin
        SalaryChange.call(employee: employee, amount: salary[:amount], effective_on: salary[:effective_on],
                          note: salary[:note], by: by)
      rescue ActiveRecord::RecordInvalid => e
        e.record.errors.each { |error| employee.errors.add("salary.#{error.attribute}", error.message) }
        raise ActiveRecord::RecordInvalid, employee
      end
    end

    employee
  end
end
