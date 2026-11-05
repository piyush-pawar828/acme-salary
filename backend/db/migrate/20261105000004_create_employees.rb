class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    create_table :employees do |t|
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :email, null: false
      t.references :country, null: false, foreign_key: true
      t.references :department, null: false, foreign_key: true
      t.string :job_title, null: false
      t.date :hired_on, null: false
      t.timestamps
    end
    add_index :employees, :email, unique: true
    add_index :employees, [ :last_name, :first_name ]
  end
end
