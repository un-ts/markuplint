import { createPlugin } from '@markuplint/ml-core'

import attributeGroupOrder from './attribute-group-order'

export default createPlugin({
  name: 'markuplint-angular-rules',
  create() {
    return {
      rules: {
        'attribute-group-order': attributeGroupOrder,
      },
    }
  },
})
