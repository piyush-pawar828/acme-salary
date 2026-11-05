class Salary < ApplicationRecord
  MAX_AMOUNT = BigDecimal("9999999999.99")

  belongs_to :employee
  belongs_to :created_by, class_name: "User"

  validates :amount, numericality: { greater_than: 0, less_than_or_equal_to: MAX_AMOUNT }
  validates :currency_code, :effective_on, presence: true
  validate :effective_on_not_in_future

  private

  def effective_on_not_in_future
    return if effective_on.blank?
    errors.add(:effective_on, "cannot be in the future") if effective_on > Date.current
  end
end
