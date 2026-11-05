# Counts SQL statements executed inside a block (schema and transaction
# statements excluded) so specs can assert "one query per endpoint".
module QueryCounter
  IGNORED = /\A(?:BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE)|sqlite_master|PRAGMA/i

  def count_queries
    count = 0
    subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |_, _, _, _, payload|
      count += 1 unless payload[:name] == "SCHEMA" || payload[:sql].match?(IGNORED)
    end
    yield
    count
  ensure
    ActiveSupport::Notifications.unsubscribe(subscriber)
  end
end

RSpec.configure { |config| config.include QueryCounter }
