import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getOnboardingTemplateUrls,
  isValidOnboardingTemplateSlug,
  listOnboardingTemplateVariants,
} from '@/lib/onboarding-templates'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isValidOnboardingTemplateSlug(params.slug)) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const variants = listOnboardingTemplateVariants(params.slug)
    const requestedVariant = request.nextUrl.searchParams.get('variant')
    const variantKey = requestedVariant ?? (variants.length === 1 ? variants[0]?.key : null)

    if (!variantKey) {
      return NextResponse.json({ error: 'Template variant is required' }, { status: 400 })
    }

    const urls = getOnboardingTemplateUrls(params.slug, variantKey)

    if (!urls) {
      return NextResponse.json({ error: 'Template variant not found' }, { status: 404 })
    }

    return NextResponse.json(urls)
  } catch (error) {
    console.error('Error in GET /api/onboarding-templates/[slug]:', error)
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
  }
}
