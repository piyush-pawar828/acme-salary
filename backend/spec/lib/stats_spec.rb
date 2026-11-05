require "rails_helper"

RSpec.describe Stats do
  describe ".summarize" do
    it "summarizes an odd count" do
      result = Stats.summarize([3, 1, 2])
      expect(result).to eq(count: 3, total: 6, mean: 2, median: 2, min: 1, max: 3)
    end

    it "takes the mean of the middle pair for an even count" do
      expect(Stats.summarize([1, 2, 3, 4])[:median]).to eq(2.5)
    end

    it "returns nils for an empty list" do
      expect(Stats.summarize([])).to eq(count: 0, total: 0, mean: nil, median: nil, min: nil, max: nil)
    end

    it "treats a single value as its own mean and median" do
      result = Stats.summarize([7])
      expect(result[:mean]).to eq(7)
      expect(result[:median]).to eq(7)
    end

    it "rounds to two decimal places" do
      result = Stats.summarize([1, 2, 2])
      expect(result[:mean]).to eq(BigDecimal("1.67"))
      expect(result[:mean]).to be_a(BigDecimal)
    end
  end
end
