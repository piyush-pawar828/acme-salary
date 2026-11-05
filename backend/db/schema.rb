# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_11_05_000006) do
  create_table "countries", force: :cascade do |t|
    t.string "code", limit: 2, null: false
    t.string "name", null: false
    t.string "currency_code", limit: 3, null: false
    t.decimal "usd_rate", precision: 12, scale: 6, null: false
    t.date "rate_as_of", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_countries_on_code", unique: true
  end

  create_table "departments", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_departments_on_name", unique: true
  end

  create_table "employees", force: :cascade do |t|
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.string "email", null: false
    t.integer "country_id", null: false
    t.integer "department_id", null: false
    t.string "job_title", null: false
    t.date "hired_on", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "current_salary_id"
    t.index ["country_id"], name: "index_employees_on_country_id"
    t.index ["current_salary_id"], name: "index_employees_on_current_salary_id"
    t.index ["department_id"], name: "index_employees_on_department_id"
    t.index ["email"], name: "index_employees_on_email", unique: true
    t.index ["last_name", "first_name"], name: "index_employees_on_last_name_and_first_name"
  end

  create_table "salaries", force: :cascade do |t|
    t.integer "employee_id", null: false
    t.decimal "amount", precision: 14, scale: 2, null: false
    t.string "currency_code", limit: 3, null: false
    t.date "effective_on", null: false
    t.string "note"
    t.integer "created_by_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_salaries_on_created_by_id"
    t.index ["employee_id", "effective_on"], name: "index_salaries_on_employee_id_and_effective_on"
    t.index ["employee_id"], name: "index_salaries_on_employee_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "employees", "countries"
  add_foreign_key "employees", "departments"
  add_foreign_key "employees", "salaries", column: "current_salary_id", on_delete: :nullify
  add_foreign_key "salaries", "employees", on_delete: :cascade
  add_foreign_key "salaries", "users", column: "created_by_id"
end
