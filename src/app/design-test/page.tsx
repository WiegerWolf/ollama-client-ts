"use client"

export default function DesignTestPage() {
  return (
    <div className="min-h-screen bg-bg-secondary p-4xl">
      <div className="max-w-4xl mx-auto space-y-4xl">
        {/* Header */}
        <div className="bg-bg-primary p-3xl rounded-large shadow-light">
          <h1 className="text-display-large text-primary mb-lg">Design System Test</h1>
          <p className="text-body-large text-secondary">
            Testing the implementation of the Ollama Web Chat design system.
          </p>
        </div>

        {/* Typography Scale */}
        <div className="bg-bg-primary p-3xl rounded-large shadow-light">
          <h2 className="text-display-medium text-primary mb-xl">Typography Scale</h2>
          <div className="space-y-md">
            <div className="text-display-large">Display Large (32px/40px)</div>
            <div className="text-display-medium">Display Medium (24px/32px)</div>
            <div className="text-heading-large">Heading Large (20px/28px)</div>
            <div className="text-heading-medium">Heading Medium (18px/24px)</div>
            <div className="text-body-large">Body Large (16px/24px)</div>
            <div className="text-body-medium">Body Medium (14px/20px)</div>
            <div className="text-body-small">Body Small (12px/16px)</div>
            <div className="text-code">Code Text (14px/20px) - Monospace</div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="bg-bg-primary p-3xl rounded-large shadow-light">
          <h2 className="text-display-medium text-primary mb-xl">Color Palette</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {/* Background Colors */}
            <div className="space-y-sm">
              <h3 className="text-heading-medium text-primary">Backgrounds</h3>
              <div className="bg-bg-primary p-md rounded-small border border-primary text-body-medium">Primary</div>
              <div className="bg-bg-secondary p-md rounded-small border border-primary text-body-medium">Secondary</div>
              <div className="bg-bg-tertiary p-md rounded-small border border-primary text-body-medium">Tertiary</div>
            </div>

            {/* Text Colors */}
            <div className="space-y-sm">
              <h3 className="text-heading-medium text-primary">Text Colors</h3>
              <div className="text-primary text-body-medium">Primary Text</div>
              <div className="text-secondary text-body-medium">Secondary Text</div>
              <div className="text-tertiary text-body-medium">Tertiary Text</div>
            </div>

            {/* Accent Colors */}
            <div className="space-y-sm">
              <h3 className="text-heading-medium text-primary">Accent Colors</h3>
              <div className="text-blue text-body-medium">Primary Blue</div>
              <div className="text-success text-body-medium">Success Green</div>
              <div className="text-warning text-body-medium">Warning Yellow</div>
              <div className="text-error text-body-medium">Error Red</div>
            </div>
          </div>
        </div>

        {/* Spacing System */}
        <div className="bg-bg-primary p-3xl rounded-large shadow-light">
          <h2 className="text-display-medium text-primary mb-xl">Spacing System</h2>
          <div className="space-y-md">
            <div className="flex items-center space-x-md">
              <div className="w-xs h-xs bg-primary-blue"></div>
              <span className="text-body-medium">xs (4px)</span>
            </div>
            <div className="flex items-center space-x-md">
              <div className="w-sm h-sm bg-primary-blue"></div>
              <span className="text-body-medium">sm (8px)</span>
            </div>
            <div className="flex items-center space-x-md">
              <div className="w-md h-md bg-primary-blue"></div>
              <span className="text-body-medium">md (12px)</span>
            </div>
            <div className="flex items-center space-x-md">
              <div className="w-lg h-lg bg-primary-blue"></div>
              <span className="text-body-medium">lg (16px)</span>
            </div>
            <div className="flex items-center space-x-md">
              <div className="w-xl h-xl bg-primary-blue"></div>
              <span className="text-body-medium">xl (20px)</span>
            </div>
            <div className="flex items-center space-x-md">
              <div className="w-2xl h-2xl bg-primary-blue"></div>
              <span className="text-body-medium">2xl (24px)</span>
            </div>
            <div className="flex items-center space-x-md">
              <div className="w-3xl h-3xl bg-primary-blue"></div>
              <span className="text-body-medium">3xl (32px)</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="bg-bg-primary p-3xl rounded-large shadow-light">
          <h2 className="text-display-medium text-primary mb-xl">Button Examples</h2>
          <div className="flex flex-wrap gap-md">
            <button className="bg-primary-blue text-white px-lg py-md rounded-small font-medium hover:bg-primary-blue-hover transition-normal">
              Primary Button
            </button>
            <button className="bg-bg-secondary text-primary border border-primary px-lg py-md rounded-small font-medium hover:bg-bg-tertiary transition-normal">
              Secondary Button
            </button>
            <button className="bg-error-red text-white px-lg py-md rounded-small font-medium hover:opacity-90 transition-normal">
              Destructive Button
            </button>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="bg-bg-primary p-3xl rounded-large shadow-light">
          <h2 className="text-display-medium text-primary mb-xl">Theme Toggle</h2>
          <button 
            onClick={() => {
              const html = document.documentElement;
              if (html.classList.contains('dark')) {
                html.classList.remove('dark');
              } else {
                html.classList.add('dark');
              }
            }}
            className="bg-primary-blue text-white px-lg py-md rounded-small font-medium hover:bg-primary-blue-hover transition-normal"
          >
            Toggle Dark Mode
          </button>
        </div>
      </div>
    </div>
  )
}