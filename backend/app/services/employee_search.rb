# Builds the employee directory query from request params: free-text search,
# country/department filters, sorting and clamped pagination.
class EmployeeSearch
  SORTS = {
    "name" => "employees.last_name %<dir>s, employees.first_name %<dir>s, employees.id %<dir>s",
    "hired_on" => "employees.hired_on %<dir>s, employees.id %<dir>s",
    "salary" => "(salaries.amount * countries.usd_rate) %<dir>s, employees.id %<dir>s"
  }.freeze
  DEFAULT_PER_PAGE = 25
  MAX_PER_PAGE = 100
  # Keeps OFFSET inside a 64-bit integer whatever the URL says.
  MAX_PAGE = 1_000_000

  attr_reader :page, :per_page

  def initialize(params)
    @params = params.to_h.with_indifferent_access
    @page = @params[:page].to_i.clamp(1, MAX_PAGE)
    @per_page = clamp_per_page(@params[:per_page])
  end

  def relation
    filtered.order(Arel.sql(order_clause)).offset((page - 1) * per_page).limit(per_page)
  end

  def total
    @total ||= filtered.count
  end

  private

  def filtered
    scope = Employee.includes(:department, :current_salary, :country)
                    .joins(:country)
                    .left_joins(:current_salary)
    scope = scope.where(countries: { code: @params[:country] }) if @params[:country].present?
    scope = scope.where(department_id: @params[:department]) if @params[:department].present?
    scope = apply_query(scope) if @params[:q].present?
    scope
  end

  def apply_query(scope)
    term = "%#{Employee.sanitize_sql_like(@params[:q].to_s.strip)}%"
    scope.where(
      "LOWER(employees.first_name || ' ' || employees.last_name) LIKE LOWER(:term) ESCAPE '\\' OR LOWER(employees.email) LIKE LOWER(:term) ESCAPE '\\'",
      term: term
    )
  end

  def order_clause
    sort = SORTS.key?(@params[:sort]) ? @params[:sort] : "name"
    dir = @params[:dir].to_s.downcase == "desc" ? "DESC" : "ASC"
    format(SORTS[sort], dir: dir)
  end

  def clamp_per_page(value)
    n = value.to_i
    return DEFAULT_PER_PAGE if n <= 0
    [ n, MAX_PER_PAGE ].min
  end
end
