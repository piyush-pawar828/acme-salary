# Cached pointer to the salary row that is current for the employee.
# Maintained by SalaryChange; nullified automatically if that row is deleted.
class AddCurrentSalaryToEmployees < ActiveRecord::Migration[8.1]
  def change
    add_reference :employees, :current_salary, foreign_key: { to_table: :salaries, on_delete: :nullify }
  end
end
