class Country < ApplicationRecord
  has_many :employees, dependent: :restrict_with_error

  validates :code, :name, :currency_code, :rate_as_of, presence: true
  validates :code, uniqueness: true
  validates :usd_rate, numericality: { greater_than: 0 }
end
