import asyncio
from ai.pipeline import ComplaintAIPipeline
from openai import OpenAI
from core.config import settings


async def main():
    p = ComplaintAIPipeline()
    r = await p.process(
        "बहुत धुआं आ रहा है factory se, saans lena mushkil",
        {"channel": "app", "area": "Anand Vihar"},
    )
    print(r)


def test_openai_call():
    client = OpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        temperature=0.1,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant. "
                    "Always respond with a valid JSON object only. "
                    'Example: {"answer": "..."}.'
                ),
            },
            {"role": "user", "content": "Who is the president of India?"},
        ],
    )

    print(response.choices[0].message.content)

    return


# test_openai_call()
asyncio.run(main())
