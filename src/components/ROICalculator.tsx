import { useState } from 'react';
import { Calculator, DollarSign, TrendingUp, PieChart, Download, BarChart3 } from 'lucide-react';

interface ROIResult {
  totalCost: number;
  totalBenefits: number;
  netBenefit: number;
  roi: number;
  paybackPeriod: number;
  benefitCostRatio: number;
}

export default function ROICalculator() {
  const [formData, setFormData] = useState({
    projectName: '',
    implementationCost: '',
    hardwareCost: '',
    softwareCost: '',
    trainingCost: '',
    maintenanceAnnual: '',
    projectDuration: '36',

    efficiencyGain: '',
    costSavings: '',
    revenueIncrease: '',
    timeSavings: '',
    errorReduction: '',
    customBenefit1: '',
    customBenefit2: '',
  });

  const [result, setResult] = useState<ROIResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const calculateROI = () => {
    const implementationCost = parseFloat(formData.implementationCost) || 0;
    const hardwareCost = parseFloat(formData.hardwareCost) || 0;
    const softwareCost = parseFloat(formData.softwareCost) || 0;
    const trainingCost = parseFloat(formData.trainingCost) || 0;
    const maintenanceAnnual = parseFloat(formData.maintenanceAnnual) || 0;
    const duration = parseInt(formData.projectDuration) || 36;

    const totalCost =
      implementationCost +
      hardwareCost +
      softwareCost +
      trainingCost +
      (maintenanceAnnual * duration) / 12;

    const costSavings = (parseFloat(formData.costSavings) || 0) * (duration / 12);
    const revenueIncrease = (parseFloat(formData.revenueIncrease) || 0) * (duration / 12);
    const timeSavings = (parseFloat(formData.timeSavings) || 0) * (duration / 12);
    const errorReduction = (parseFloat(formData.errorReduction) || 0) * (duration / 12);
    const customBenefit1 = (parseFloat(formData.customBenefit1) || 0) * (duration / 12);
    const customBenefit2 = (parseFloat(formData.customBenefit2) || 0) * (duration / 12);

    const totalBenefits =
      costSavings + revenueIncrease + timeSavings + errorReduction + customBenefit1 + customBenefit2;

    const netBenefit = totalBenefits - totalCost;
    const roi = totalCost > 0 ? (netBenefit / totalCost) * 100 : 0;
    const benefitCostRatio = totalCost > 0 ? totalBenefits / totalCost : 0;

    const annualBenefit = (totalBenefits / duration) * 12;
    const paybackPeriod = annualBenefit > 0 ? totalCost / annualBenefit : 0;

    setResult({
      totalCost,
      totalBenefits,
      netBenefit,
      roi,
      paybackPeriod,
      benefitCostRatio,
    });
  };

  const exportResults = () => {
    if (!result) return;

    const report = `
ROI ANALYSIS REPORT
Project: ${formData.projectName || 'Unnamed Project'}
Duration: ${formData.projectDuration} months

COST BREAKDOWN:
Implementation: $${parseFloat(formData.implementationCost || '0').toLocaleString()}
Hardware: $${parseFloat(formData.hardwareCost || '0').toLocaleString()}
Software: $${parseFloat(formData.softwareCost || '0').toLocaleString()}
Training: $${parseFloat(formData.trainingCost || '0').toLocaleString()}
Maintenance (Total): $${(
      (parseFloat(formData.maintenanceAnnual || '0') * parseInt(formData.projectDuration || '36')) /
      12
    ).toLocaleString()}
Total Cost: $${result.totalCost.toLocaleString()}

BENEFITS:
Cost Savings: $${(parseFloat(formData.costSavings || '0') * (parseInt(formData.projectDuration || '36') / 12)).toLocaleString()}
Revenue Increase: $${(parseFloat(formData.revenueIncrease || '0') * (parseInt(formData.projectDuration || '36') / 12)).toLocaleString()}
Time Savings Value: $${(parseFloat(formData.timeSavings || '0') * (parseInt(formData.projectDuration || '36') / 12)).toLocaleString()}
Error Reduction Value: $${(parseFloat(formData.errorReduction || '0') * (parseInt(formData.projectDuration || '36') / 12)).toLocaleString()}
Total Benefits: $${result.totalBenefits.toLocaleString()}

KEY METRICS:
Net Benefit: $${result.netBenefit.toLocaleString()}
ROI: ${result.roi.toFixed(2)}%
Benefit-Cost Ratio: ${result.benefitCostRatio.toFixed(2)}
Payback Period: ${result.paybackPeriod.toFixed(1)} years

Generated: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ROI_Analysis_${formData.projectName || 'Report'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-themed-primary flex items-center gap-3">
          <Calculator className="w-8 h-8 text-emerald-600" />
          ROI Calculator & Cost-Benefit Analysis
        </h2>
        <p className="text-themed-secondary mt-1">
          Calculate return on investment and analyze cost-benefits for smart city projects
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-themed-secondary border border-themed-primary rounded-xl p-6">
            <h3 className="text-lg font-bold text-themed-primary mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-600" />
              Project Costs
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                  placeholder="Enter project name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-themed-secondary mb-1">
                    Implementation Cost
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.implementationCost}
                    onChange={(e) => setFormData({ ...formData, implementationCost: e.target.value })}
                    className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-themed-secondary mb-1">
                    Hardware Cost
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.hardwareCost}
                    onChange={(e) => setFormData({ ...formData, hardwareCost: e.target.value })}
                    className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-themed-secondary mb-1">
                    Software Cost
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.softwareCost}
                    onChange={(e) => setFormData({ ...formData, softwareCost: e.target.value })}
                    className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-themed-secondary mb-1">
                    Training Cost
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.trainingCost}
                    onChange={(e) => setFormData({ ...formData, trainingCost: e.target.value })}
                    className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-themed-secondary mb-1">
                    Annual Maintenance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.maintenanceAnnual}
                    onChange={(e) => setFormData({ ...formData, maintenanceAnnual: e.target.value })}
                    className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-themed-secondary mb-1">
                    Project Duration (months)
                  </label>
                  <input
                    type="number"
                    value={formData.projectDuration}
                    onChange={(e) => setFormData({ ...formData, projectDuration: e.target.value })}
                    className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                    placeholder="36"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-themed-secondary border border-themed-primary rounded-xl p-6">
            <h3 className="text-lg font-bold text-themed-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Expected Benefits (Annual)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">
                  Annual Cost Savings
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costSavings}
                  onChange={(e) => setFormData({ ...formData, costSavings: e.target.value })}
                  className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">
                  Annual Revenue Increase
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.revenueIncrease}
                  onChange={(e) => setFormData({ ...formData, revenueIncrease: e.target.value })}
                  className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">
                  Time Savings Value (Annual)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.timeSavings}
                  onChange={(e) => setFormData({ ...formData, timeSavings: e.target.value })}
                  className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">
                  Error Reduction Value (Annual)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.errorReduction}
                  onChange={(e) => setFormData({ ...formData, errorReduction: e.target.value })}
                  className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                  placeholder="0.00"
                />
              </div>

              {showAdvanced && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-themed-secondary mb-1">
                      Custom Benefit 1 (Annual)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.customBenefit1}
                      onChange={(e) => setFormData({ ...formData, customBenefit1: e.target.value })}
                      className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-themed-secondary mb-1">
                      Custom Benefit 2 (Annual)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.customBenefit2}
                      onChange={(e) => setFormData({ ...formData, customBenefit2: e.target.value })}
                      className="w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
                      placeholder="0.00"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {showAdvanced ? '- Hide' : '+ Show'} advanced options
            </button>
          </div>

          <button
            onClick={calculateROI}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
          >
            <Calculator className="w-5 h-5" />
            Calculate ROI
          </button>
        </div>

        <div className="space-y-6">
          {result ? (
            <>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-4">
                  ROI Analysis Results
                </h3>

                <div className="space-y-4">
                  <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-1">Return on Investment</p>
                    <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                      {result.roi.toFixed(2)}%
                    </p>
                  </div>

                  <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-1">Net Benefit</p>
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                      ${result.netBenefit.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-1">Payback Period</p>
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                      {result.paybackPeriod.toFixed(1)} years
                    </p>
                  </div>

                  <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-1">Benefit-Cost Ratio</p>
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                      {result.benefitCostRatio.toFixed(2)}:1
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-themed-secondary border border-themed-primary rounded-xl p-6">
                <h3 className="text-lg font-bold text-themed-primary mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  Cost vs Benefits
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-themed-secondary">Total Costs</span>
                      <span className="text-sm font-semibold text-red-600">
                        ${result.totalCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-themed-hover rounded-full h-3">
                      <div
                        className="bg-red-600 h-3 rounded-full"
                        style={{
                          width: `${
                            (result.totalCost / Math.max(result.totalCost, result.totalBenefits)) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-themed-secondary">Total Benefits</span>
                      <span className="text-sm font-semibold text-green-600">
                        ${result.totalBenefits.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-themed-hover rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full"
                        style={{
                          width: `${
                            (result.totalBenefits / Math.max(result.totalCost, result.totalBenefits)) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-4 p-4 rounded-lg ${
                    result.roi > 0
                      ? 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      result.roi > 0
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-red-900 dark:text-red-100'
                    }`}
                  >
                    {result.roi > 0
                      ? '✓ Project shows positive ROI'
                      : '✗ Project shows negative ROI - Review costs and benefits'}
                  </p>
                </div>
              </div>

              <button
                onClick={exportResults}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-themed-primary text-themed-secondary hover:bg-themed-hover rounded-lg transition font-medium"
              >
                <Download className="w-5 h-5" />
                Export Report
              </button>
            </>
          ) : (
            <div className="bg-themed-secondary border border-themed-primary rounded-xl p-6 text-center">
              <BarChart3 className="w-16 h-16 text-themed-tertiary mx-auto mb-4" />
              <p className="text-themed-secondary">
                Fill in the cost and benefit fields, then click Calculate ROI to see your analysis
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
