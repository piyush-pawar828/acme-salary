class Employee < ApplicationRecord
  EMAIL_FORMAT = /\A[^@\s]+@[^@\s]+\z/

  belongs_to :country
  belongs_to :department
  belongs_to :current_salary, class_name: "Salary", optional: true
  has_many :salaries, dependent: :destroy

  normalizes :email, with: ->(email) { email.strip.downcase }

  validates :first_name, :last_name, :job_title, :hired_on, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: EMAIL_FORMAT }
  validate :country_unchanged, on: :update

  def full_name
    "#{first_name} #{last_name}"
  end

  private

  # Exchange rates are keyed by country, so moving an employee would re-rate
  # their whole salary history. Relocation is handled as offboard + onboard.
  def country_unchanged
    errors.add(:country_id, "cannot be changed") if country_id_changed?
  end
end
