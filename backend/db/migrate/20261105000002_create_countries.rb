class CreateCountries < ActiveRecord::Migration[8.1]
  def change
    create_table :countries do |t|
      t.string :code, null: false, limit: 2
      t.string :name, null: false
      t.string :currency_code, null: false, limit: 3
      # USD per 1 unit of local currency, fixed as of rate_as_of.
      t.decimal :usd_rate, precision: 12, scale: 6, null: false
      t.date :rate_as_of, null: false
      t.timestamps
    end
    add_index :countries, :code, unique: true
  end
end
