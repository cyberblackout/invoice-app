'use client'

import { useState } from 'react'
import { SUBSCRIPTION_PLANS, SubscriptionTier, SubscriptionPlan } from '@/lib/subscriptions'

interface PricingPageProps {
  currentPlan?: SubscriptionTier
  onSelectPlan?: (plan: SubscriptionPlan) => void
}

export default function PricingPage({ currentPlan = 'free', onSelectPlan }: PricingPageProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>(currentPlan)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const yearlyDiscount = 0.2
  const getPrice = (plan: SubscriptionPlan) => {
    if (plan.price === 0) return 0
    return billingCycle === 'yearly' ? plan.price * 12 * (1 - yearlyDiscount) : plan.price
  }

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan.id)
    onSelectPlan?.(plan)
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Choose Your Plan</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          Scale your business with the right plan for you
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '12px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px' }}>
          <button
            className={`btn ${billingCycle === 'monthly' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={`btn ${billingCycle === 'yearly' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly <span style={{ fontSize: '12px', marginLeft: '4px', color: 'var(--success)' }}>-20%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-3" style={{ gap: '24px' }}>
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id
          const isCurrent = currentPlan === plan.id
          const price = getPrice(plan)
          const isPopular = plan.id === 'pro'

          return (
            <div
              key={plan.id}
              className="card"
              style={{
                border: isPopular ? '2px solid var(--accent)' : isSelected ? '2px solid var(--success)' : '1px solid var(--border)',
                position: 'relative',
                transform: isPopular ? 'scale(1.02)' : 'none'
              }}
            >
              {isPopular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--accent)',
                  color: 'white',
                  padding: '4px 16px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  MOST POPULAR
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: '24px', paddingTop: isPopular ? '12px' : '0' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>{plan.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '36px', fontWeight: '700' }}>₵{price.toFixed(0)}</span>
                  {plan.price > 0 && (
                    <span style={{ color: 'var(--text-muted)' }}>/{billingCycle === 'yearly' ? 'year' : 'mo'}</span>
                  )}
                </div>
                {billingCycle === 'yearly' && plan.price > 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Save ₵{(plan.price * 12 * yearlyDiscount).toFixed(0)}/year
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                {plan.features.map((feature, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--success)', fontSize: '16px' }}>✓</span>
                    <span style={{ fontSize: '14px' }}>{feature}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 'auto' }}>
                {isCurrent ? (
                  <button className="btn btn-secondary" disabled style={{ width: '100%' }}>
                    Current Plan
                  </button>
                ) : plan.price === 0 ? (
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleSelectPlan(plan)}
                    style={{ width: '100%' }}
                  >
                    Downgrade to Free
                  </button>
                ) : (
                  <button
                    className={`btn ${isPopular ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleSelectPlan(plan)}
                    style={{ width: '100%' }}
                  >
                    {currentPlan === 'free' ? 'Upgrade' : 'Switch Plan'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>All plans include GHS currency support and GRA compliance features.</p>
        <p style={{ marginTop: '8px' }}>
          Need a custom plan? <a href="mailto:support@cyberinvoiceflow.com" style={{ color: 'var(--accent)' }}>Contact us</a>
        </p>
      </div>

      <div className="card" style={{ marginTop: '48px', maxWidth: '600px', margin: '48px auto' }}>
        <h3 style={{ marginBottom: '16px', textAlign: 'center' }}>Frequently Asked Questions</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Can I change plans anytime?</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Yes! You can upgrade or downgrade anytime. Changes take effect immediately.
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>What payment methods are supported?</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Mobile Money (MTN, Vodafone, AirtelTigo), Cards, and Bank Transfer via Paystack and Hubtel.
          </p>
        </div>

        <div>
          <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Is there a free trial?</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Start with our Free plan and upgrade when you&apos;re ready. No credit card required.
          </p>
        </div>
      </div>
    </div>
  )
}
