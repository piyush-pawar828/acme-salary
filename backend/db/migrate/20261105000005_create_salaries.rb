class CreateSalaries < ActiveRecord::Migration[8.1]
  def change
    create_table :salaries do |t|
      t.references :employee, null: false, foreign_key: { on_delete: :cascade }
      t.decimal :amount, precision: 14, scale: 2, null: false
      t.string :currency_code, null: false, limit: 3
      t.date :effective_on, null: false
      t.string :note
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.timestamps
    end
    add_index :salaries, [ :employee_id, :effective_on ]
  end
end
